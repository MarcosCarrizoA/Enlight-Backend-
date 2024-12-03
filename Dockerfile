FROM debian:buster-slim
WORKDIR /app
COPY enlight .
COPY firebase-private-key.json .
COPY pages ./pages
RUN chmod +x enlight
ENTRYPOINT ["./enlight"]
