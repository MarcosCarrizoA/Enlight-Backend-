FROM ubuntu:25.04
WORKDIR /app
COPY enlight .
COPY firebase-private-key.json .
COPY pages ./pages
ENTRYPOINT ["./enlight"]
