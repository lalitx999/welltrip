"""
HTTP layer for the payments API (Step 3, payments slice: slip upload/status).

WHY only TWO endpoints here (per C3 §5.3):
- POST /payments/slips/upload/ - tourist uploads one slip for a pending payment.
- GET  /payments/{id}/        - the tourist polls the "waiting for slip check"
  page (payment state + payee snapshot + every uploaded slip).

WHY upload only calls create_slip() (NOT verify_slip()):
- C3 §5.3 described upload as create_slip() -> verify_slip() in one shot, but
  verify_slip() calls _call_slip_provider() which raises NotImplementedError
  until a provider vendor is configured. Doing both synchronously would make
  EVERY upload fail with 503 after already storing the slip. Per the agreed
  design (user decision, Slice 5) upload stops after persisting the PENDING_CHECK
  slip; verification is wired when a real provider/credentials arrive.

WHY no SUPER_ADMIN override in this money flow:
- Uploading/confirming a payment is a TOURIST action tied to a booking the user
  owns. An admin acting "for" a tourist would pollute booking/payment history,
  so ownership is enforced strictly: payment.booking.user must equal the caller
  (unlike vendor content management where SUPER_ADMIN may help).
"""
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.responses import api_success
from common.views import EnvelopeMixin

from .models import Payment, PaymentStatus
from .serializers import (
    PaymentDetailSerializer,
    PaymentSlipSerializer,
    SlipUploadSerializer,
)
from .services import create_slip


def _get_owned_payment(payment_id, user):
    """Fetch a payment whose booking belongs to `user`; else 404 (no leak).

    Strict ownership: payment.booking.user_id must equal the caller. SUPER_ADMIN
    is deliberately NOT allowed to act on somebody else's payment (money flow).
    """
    try:
        payment = Payment.objects.select_related("booking").get(pk=payment_id)
    except Payment.DoesNotExist as exc:
        raise NotFound("Payment not found.") from exc
    if payment.booking.user_id != user.id:
        # Do not reveal that the payment exists.
        raise NotFound("Payment not found.")
    return payment


# ---------------------------------------------------------------------------
# POST /api/v1/payments/slips/upload/   (multipart: payment_id + image)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def slip_upload_view(request):
    """Persist one uploaded slip as PENDING_CHECK for a pending payment.

    Strict money-flow ownership: the payment must belong to the caller
    (payment.booking.user). Slip stays PENDING_CHECK until a verification step
    (wired once a Slip Check provider is configured) runs.
    """
    serializer = SlipUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    payment = _get_owned_payment(data["payment_id"], request.user)
    if payment.status != PaymentStatus.PENDING:
        raise ValidationError(
            {"payment_id": "Payment is not pending anymore; cannot attach a slip."}
        )

    try:
        slip = create_slip(
            payment_id=str(payment.id),
            image_file=data["image"],
            uploaded_by=request.user,
        )
    except ValueError as exc:
        raise ValidationError(str(exc)) from exc

    return api_success(
        PaymentSlipSerializer(slip, context={"request": request}).data,
        message="Slip uploaded. Awaiting verification.",
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/payments/{id}/
# ---------------------------------------------------------------------------
class PaymentDetailView(EnvelopeMixin, APIView):
    """Payment state + payee + slip history, visible ONLY to the booking owner."""

    @property
    def success_message(self):
        return "Payment retrieved."

    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        payment = _get_owned_payment(payment_id, request.user)
        # Single payment -> nested slips cost exactly one extra query (1:1 -> M),
        # not an N+1; no prefetch needed for a detail endpoint.
        data = PaymentDetailSerializer(
            payment, context={"request": request}
        ).data
        return Response(data, status=status.HTTP_200_OK)


