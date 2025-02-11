FROM ubuntu:22.04 AS base

ARG BUILDROOT_BASE=/root

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update \
    && apt install -qy \
        build-essential \
        git \
        autoconf \
        shtool \
        pkg-config \
        libtool \
        jq \
        xxd \
        curl \
        help2man

FROM base AS build

ARG BUILDROOT_BASE
WORKDIR $BUILDROOT_BASE

RUN git clone https://github.com/bitfinexcom/grenache-cli.git \
    && cd grenache-cli \
    && git submodule update --init \
    && ./autogen.sh \
    && ./configure \
    && make \
    && make install

# FROM node:23-alpine
# COPY --from=build /usr/local/bin/ /usr/local/bin/

# RUN apk add --no-cache \
#         curl \
#         nmap \
#         bash \
#         jq \
#     && npm i -g grenache-grape \
#     && ln -s /bin/getopt /usr/bin/getopt \
#     && ln -s /bin/cat /usr/bin/cat \
#     && ln -s /bin/mkdir /usr/bin/mkdir

FROM node:23-bookworm-slim    
COPY --from=build /usr/local/bin/ /usr/local/bin/
    
RUN apt update \
    && apt install -yq \
        nmap \
        curl \
        jq \
    && npm i -g grenache-grape wscat

ENTRYPOINT [ "bash" ]