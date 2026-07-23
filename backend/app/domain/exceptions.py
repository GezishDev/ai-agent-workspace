class DomainError(Exception):
    """Base exception for expected business-rule failures."""


class AuthenticationError(DomainError):
    """Raised when credentials are invalid."""


class DuplicateUserError(DomainError):
    """Raised when a registration email is already in use."""

