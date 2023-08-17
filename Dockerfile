FROM node:latest as node
WORKDIR /opt/app/src
COPY ./* /opt/app/src/