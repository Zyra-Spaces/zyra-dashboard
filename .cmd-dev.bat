@echo off
set NODE_OPTIONS=--max-http-header-size=65536
next dev --turbopack --port 8080

