import time
from typing import List, Tuple
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class ServerTimingCollector:
    def __init__(self):
        self.timings: List[Tuple[str, float]] = []

    class Timer:
        def __init__(self, collector, name):
            self.collector = collector
            self.name = name
            self.start = None

        def __enter__(self):
            self.start = time.perf_counter()
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            elapsed = (time.perf_counter() - self.start) * 1000
            self.collector.timings.append((self.name, elapsed))

        async def __aenter__(self):
            self.start = time.perf_counter()
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            elapsed = (time.perf_counter() - self.start) * 1000
            self.collector.timings.append((self.name, elapsed))

    def time(self, name: str):
        """Return a context manager to time a block with the given name."""
        return ServerTimingCollector.Timer(self, name)

    def add(self, name: str, duration_ms: float):
        """Manually add a timing entry."""
        self.timings.append((name, duration_ms))

    def header_value(self) -> str:
        """Format timings as Server-Timing header value."""
        return ", ".join(f"{name};dur={duration_ms:.2f}" for name, duration_ms in self.timings)


class ServerTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        collector = ServerTimingCollector()
        request.state.server_timing = collector
        with collector.time("app"):
            response = await call_next(request)
        response.headers["Server-Timing"] = collector.header_value()
        return response
