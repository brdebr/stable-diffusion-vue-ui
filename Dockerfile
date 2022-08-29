# Node build
# -------------------------------------------------------------------------

FROM node:14.16.1 AS node-build

RUN apt update

RUN mkdir /frontend-app
WORKDIR /frontend-app

COPY ./frontend/ .

RUN npm ci

# assets are in the folder /frontend-app/dist
RUN npm run build

# Python API
# -------------------------------------------------------------------------

FROM python:3.9 AS py-api

RUN mkdir /app
WORKDIR /app

RUN apt update

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir static

COPY --from=node-build /frontend-app/dist/ /app/static/

EXPOSE 9000

ENTRYPOINT ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "9000"]