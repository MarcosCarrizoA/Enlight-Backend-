FROM debian:buster-slim
WORKDIR /app
COPY enlight .
COPY firebase-private-key.json .
RUN chmod +x enlight
ENTRYPOINT ["./enlight"]
