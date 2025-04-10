FROM ubuntu:25.04
WORKDIR /app
COPY enlight .
COPY firebase-private-key.json .
COPY pages ./pages
COPY generated/prisma ./generated/prisma
RUN chmod +x enlight
ENTRYPOINT ["./enlight"]
