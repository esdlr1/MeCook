export function notFoundHandler(_req, res) {
    res.status(404).json({ message: "Not found" });
}
export function errorHandler(error, _req, res, _next) {
    const message = process.env.NODE_ENV === "production" ? "Internal server error" : error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
}
