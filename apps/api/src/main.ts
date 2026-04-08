import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ZodValidationPipe } from 'nestjs-zod'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.use(cookieParser())
  app.useGlobalPipes(new ZodValidationPipe())

  const port = process.env['PORT'] ?? 3000
  await app.listen(port)
  console.log(`API running on port ${port}`)
}

bootstrap()
