import time


class ServerTimingCollector:
    """
    Collects timing metrics for a request, for use in the Server-Timing HTTP header.
    Timings are recorded in order of entry, supporting nested timers.
    """

    def __init__(self) -> None:
        """
        Initialize the timings list.
        """
        self.timings: list[dict[str, float | None]] = []

    class Timer:
        """
        Context manager for timing a block of code.
        Appends a timing entry on entry, and fills in the duration on exit.
        Supports both synchronous (`with`) and asynchronous (`async with`) usage.
        """

        def __init__(self, collector: "ServerTimingCollector", name: str) -> None:
            """
            Args:
                collector: The parent ServerTimingCollector instance.
                name: The name of this timing metric.
            """
            self.collector: ServerTimingCollector = collector
            self.name: str = name
            self.start: float | None = None
            self.index: int | None = None  # index in collector.timings

        def __enter__(self) -> "ServerTimingCollector.Timer":
            """
            Start timing and append an entry with None duration.
            Returns:
                self
            """
            self.start = time.perf_counter()
            self.index = len(self.collector.timings)
            self.collector.timings.append(
                {
                    "name": self.name,
                    "start": self.start,
                    "dur": None,
                }
            )
            return self

        def __exit__(self, exc_type, exc_val, exc_tb) -> None:
            """
            Stop timing and update the duration for this entry.
            """
            end = time.perf_counter()
            dur = (end - self.start) * 1000
            self.collector.timings[self.index]["dur"] = dur

        async def __aenter__(self) -> "ServerTimingCollector.Timer":
            """
            Async version of __enter__.
            Returns:
                self
            """
            return self.__enter__()

        async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
            """
            Async version of __exit__.
            """
            self.__exit__(exc_type, exc_val, exc_tb)

    def time(self, name: str) -> "ServerTimingCollector.Timer":
        """
        Get a Timer context manager for timing a block with the given name.
        Args:
            name: The metric name.
        Returns:
            Timer context manager.
        """
        return ServerTimingCollector.Timer(self, name)

    def add(self, name: str, duration_ms: float) -> None:
        """
        Manually add a timing entry.
        Args:
            name: The metric name.
            duration_ms: The duration in milliseconds.
        """
        self.timings.append(
            {
                "name": name,
                "start": None,
                "dur": duration_ms,
            }
        )

    def header_value(self) -> str:
        """
        Format timings for use in the Server-Timing response header.
        Returns:
            A string suitable for the Server-Timing header.
        """
        return ", ".join(f"{t['name']};dur={t['dur']:.2f}" for t in self.timings if t["dur"] is not None)


from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class ServerTimingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI/Starlette middleware that attaches a ServerTimingCollector to each request,
    times the full request duration, and adds a Server-Timing header to all responses.
    """

    async def dispatch(self, request: Request, call_next) -> object:
        """
        Middleware entry point.
        Args:
            request: The incoming request.
            call_next: Callable to process the request further.
        Returns:
            The response, with Server-Timing header.
        """
        collector = ServerTimingCollector()
        request.state.server_timing = collector
        with collector.time("app"):
            response = await call_next(request)
        response.headers["Server-Timing"] = collector.header_value()
        return response
