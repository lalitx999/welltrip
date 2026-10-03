"""
OTOP stock business logic (spec §2.3 + Phase-1 Step-2 list).

Design decisions (WHY):
1. reserve_stock()/restore_stock() are the ONLY places that mutate
   stock_quantity besides the product CRUD endpoints. Centralising the two
   write paths means one place to reason about "did we hold too much?" and one
   place to review, instead of spreading decrements across callers.
2. Both functions lock the product row with select_for_update() and therefore
   MUST be called inside a transaction.atomic() block (the checkout flow and
   the expiry worker both provide one). Without the row lock, two concurrent
   checkouts could both read "1 left" and both sell the same last unit.
3. reserve_stock() only accepts ACTIVE products (you cannot sell something the
   vendor has switched off), while restore_stock() deliberately does NOT check
   is_active: a vendor may deactivate a product while a booking is still
   awaiting payment, and the expiry worker must still be able to give its
   stock back. Filtering on is_active there would silently leak inventory.
4. quantity is validated as a positive integer BEFORE touching the database so
   a bogus caller can never turn a 0/-1 request into a row update.
"""
from .models import OTOPProduct


def _validate_quantity(quantity):
    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity < 1:
        raise ValueError("quantity must be a positive integer.")


def reserve_stock(product_id, quantity):
    """Atomically hold `quantity` units for an unpaid booking.

    Must be called inside transaction.atomic() (the checkout flow).

    Returns the locked OTOPProduct with its updated stock_quantity.
    Raises ValueError when the product is missing/inactive or the requested
    quantity exceeds the remaining stock.
    """
    _validate_quantity(quantity)

    product = (
        OTOPProduct.objects.select_for_update()
        .filter(pk=product_id, is_active=True)
        .first()
    )
    if product is None:
        raise ValueError("OTOP product not found or inactive.")

    if product.stock_quantity < quantity:
        raise ValueError(
            f"Insufficient stock: only {product.stock_quantity} left "
            f"but {quantity} requested."
        )

    product.stock_quantity -= quantity
    product.save(update_fields=["stock_quantity"])
    return product


def restore_stock(product_id, quantity):
    """Return `quantity` units that an unpaid/expired booking had held.

    Must be called inside transaction.atomic() (the expiry/rollback worker).

    NOTE: no is_active filter on purpose - see module docstring point 3.
    Returns the locked OTOPProduct with its updated stock_quantity.
    Raises ValueError when the product no longer exists.
    """
    _validate_quantity(quantity)

    product = OTOPProduct.objects.select_for_update().filter(pk=product_id).first()
    if product is None:
        raise ValueError("OTOP product no longer exists; cannot restore stock.")

    product.stock_quantity += quantity
    product.save(update_fields=["stock_quantity"])
    return product
