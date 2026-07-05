import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImagePreview from './ImagePreview'

describe('ImagePreview', () => {
  it('renders the image with the given url', () => {
    render(<ImagePreview url="https://example.com/pic.png" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/pic.png')
  })

  // Regression test: onError used to just set `style.display = 'none'`, silently hiding
  // the broken image with no indication to the user that anything went wrong.
  it('shows a failure placeholder instead of silently hiding the image on load error', () => {
    render(<ImagePreview url="https://example.com/broken.png" />)
    const img = screen.getByRole('img')

    fireEvent.error(img)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Image failed to load')).toBeInTheDocument()
  })
})
