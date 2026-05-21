interface Props {
  url: string
  alt?: string
}

export default function ImagePreview({ url, alt = 'image' }: Props) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt={alt}
        className="max-w-xs max-h-64 rounded object-contain cursor-pointer hover:opacity-90 transition-opacity mt-1"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </a>
  )
}
