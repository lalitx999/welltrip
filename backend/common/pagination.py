"""
Standard DRF pagination that renders the spec §4 envelope (Phase1.md §3
Folder Tree: "pagination.py").

WHY a custom paginator at all:
- DRF's default `get_paginated_response` returns
  `{count, next, previous, results}` which breaks the project-wide response
  contract. Every API response must be
  `{success, data, message, meta}` (via common.responses), so pagination is
  re-shaped here instead of inside each view.

WHY PageNumberPagination (not LimitOffsetPagination):
- The spec §4 meta exposes `page` and `total_pages`, which map 1:1 onto
  Django's Paginator. Limit/offset would force us to reverse-engineer the
  page number from the offset (fragile with live data). PageNumber also gives
  free "page out of range" handling as a 404.

Query contract for clients:  ?page=1&limit=20   (default limit = page_size)
"""
from rest_framework.pagination import PageNumberPagination

from common.responses import api_success


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

    def get_paginated_response(self, data):
        """Wrap the page through api_success() with spec §4 meta.pagination."""
        page = self.page
        paginator = page.paginator
        return api_success(
            data,
            meta={
                "pagination": {
                    "page": page.number,
                    "limit": self.get_page_size(self.request),
                    "total_items": paginator.count,
                    # Empty result still renders as page 1 (Django reports
                    # num_pages=0 for count=0), so floor it at 1 for clients.
                    "total_pages": max(1, paginator.num_pages),
                }
            },
        )
