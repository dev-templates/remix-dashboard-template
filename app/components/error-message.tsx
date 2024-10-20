
export interface ErrorMessageProps {
  error?: string;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  return <p className='pt-1 text-destructive'>{error}</p>
}
