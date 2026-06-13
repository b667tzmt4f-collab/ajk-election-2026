function Error({ statusCode, message }: { statusCode: number; message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-400">{statusCode || 'Error'}</h1>
        <p className="text-gray-300 mb-6">{message || 'Something went wrong.'}</p>
        {statusCode === 500 && (
          <div className="bg-gray-900 rounded-lg p-4 text-left text-sm text-gray-400 mb-6">
            <p className="font-semibold text-yellow-400 mb-2">Common causes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Missing or incorrect <code>.env.local</code> file</li>
              <li>Wrong Supabase URL or API key</li>
              <li>Supabase tables not yet created (run SQL migrations)</li>
            </ul>
          </div>
        )}
        <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Try again
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode, message: err?.message }
}

export default Error
