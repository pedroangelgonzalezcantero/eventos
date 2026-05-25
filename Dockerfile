FROM ubuntu:latest
LABEL authors="pedrgonz"

ENTRYPOINT ["java", "-jar", "app.jar"]
