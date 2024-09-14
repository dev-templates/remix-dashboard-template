
export interface ErrorMessageProps {
  error?: string;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  return <p className='pt-1 text-red-700'>{error}</p>
}
