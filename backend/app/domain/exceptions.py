"""Domain exceptions.

These represent expected business-rule failures and are intentionally
separate from infrastructure errors. Route handlers map them to HTTP
status codes; they never carry stack traces in API responses.
"""


class DomainError(Exception):
    """Base exception for expected business-rule failures."""


class AuthenticationError(DomainError):
    """Raised when credentials are invalid or the token is expired."""


class DuplicateUserError(DomainError):
    """Raised when a registration email is already in use."""


class NotFoundError(DomainError):
    """Raised when a requested resource does not exist for the caller."""
