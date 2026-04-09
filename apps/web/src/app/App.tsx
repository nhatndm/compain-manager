import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateUserSchema, type CreateUserDto } from '@repo/schemas'

function UserForm(): JSX.Element {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserDto>({
    resolver: zodResolver(CreateUserSchema),
  })

  const onSubmit = (_data: CreateUserDto): void => {
    // TODO: wire up to API
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          className="border rounded px-3 py-2 w-full"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>
      <div>
        <input
          {...register('name')}
          placeholder="Name"
          className="border rounded px-3 py-2 w-full"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Create User
      </button>
    </form>
  )
}

function AppContent(): JSX.Element {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow rounded p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Compain Manager</h1>
        <UserForm />
      </div>
    </main>
  )
}

export function App(): JSX.Element {
  return (
    <AppContent />
  )
}
