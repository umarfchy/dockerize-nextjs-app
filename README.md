<!-- > **Note**
> Notes can be added here-->

> **Warning**
> This is a demo on how you can containerize a nextjs application at its bare basic. I'd recommend the [official guide](https://nextjs.org/docs/deployment) for the production grade deployment.

To containerize a nextjs application, a multi-stage docker will be employed with three stages. Before starting the process we need to make sure that the `next.config.js` file has the following property `output: "standalone"`. It will be explained on stage 2 why would we need this. Let's start by creating the `Dockerfile`

At the stage 1, we'll install all the dependencies that will be required to build and run the application. We start from the  `node:16-alpine` base image and name the stage `deps`. 
```dockerfile
FROM node:16-alpine AS deps
```

Aftward, we install `libc6-compat`. As alpline images are usually small they can sometimes lack all the dependencies require for applications to run. To add those missing libraries, it is recommended to add `libc6-compat`. You can read more [here](https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine).

```dockerfile
RUN apk add --no-cache libc6-compat
```

Now, we change the working directory in the image to `/app`.

```dockerfile
WORKDIR /app
```

Now, we'll copy the package.json and yarn.lock and install all the required node modules.
`--prod` flag will ensures that only the production dependencies are installed. Upon installation, this will mark the end of stage 1.

```dockerfile
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn install --frozen-lockfile --prod
```


We begin the stage 2 `node:16-alpine` base image aging but this time name the stage `builder`. Afterword, we change the working directory in the docker image to `/app`.

```dockerfile
FROM node:16-alpine AS builder
WORKDIR /app
```

Now, we'll copy all dependencies to the image's current working directory (`/app`). `--from=deps` is used to refer to the stage 1 (`deps`). Thefore, the copying of `node_modules` will take places from stage 1's `/app` directory to current images working directory which is also named `/app`. Once dependecies have been copied, the source codes will be copied from the user's local machines current directory to the docker image's `/app` directory.

```dockerfile
COPY --from=deps /app/node_modules ./node_modules
COPY . .
```
If there is a file containing environment variable then that needs to be renamed to `.env.production`. For example: 

```dockerfile
COPY .env.production.sample .env.production
```

Once, all the necessary files are copied, `yarn bulid` will be used to generate the production build. With this stage 2 is complete. 

```dockerfile
RUN yarn build
```

We start stage 3, with `node:16-alpine` image aging as previous stages however we no longer require to name the stage. We then change the working directory to `/app` and add the enviroment variable `NODE_ENV=production`.


```dockerfile
FROM node:16-alpine
WORKDIR /app
ENV NODE_ENV=production
```

Now, we'll copy all the production build assets to current images from the stage 2 (`builder`) as follows:

```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

If the default configuration of `next.config.js` is not used then it needs to be copied to the image as follows:

```dockerfile
COPY --from=builder /app/next.config.js ./
```

Now, we can expose the port that will the used by the application and set the port to the enviroment variable.

```dockerfile
EXPOSE 3000
ENV PORT 3000
```

Finally, we start the server by the following command. 

```dockerfile
CMD ["node", "server.js"]
```