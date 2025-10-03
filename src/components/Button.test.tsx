import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should apply primary variant styles by default', () => {
    render(<Button>Button</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-blue-600')
  })

  it('should apply correct variant styles', () => {
    const { rerender } = render(<Button variant="secondary">Button</Button>)
    expect(screen.getByRole('button').className).toContain('bg-gray-200')

    rerender(<Button variant="outline">Button</Button>)
    expect(screen.getByRole('button').className).toContain('border-2')

    rerender(<Button variant="danger">Button</Button>)
    expect(screen.getByRole('button').className).toContain('bg-red-600')
  })

  it('should apply correct size styles', () => {
    const { rerender } = render(<Button size="sm">Button</Button>)
    expect(screen.getByRole('button').className).toContain('h-8')

    rerender(<Button size="md">Button</Button>)
    expect(screen.getByRole('button').className).toContain('h-10')

    rerender(<Button size="lg">Button</Button>)
    expect(screen.getByRole('button').className).toContain('h-12')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show loading state', () => {
    render(<Button isLoading>Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
  })

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should not call onClick when loading', () => {
    const handleClick = jest.fn()
    render(<Button isLoading onClick={handleClick}>Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should render left icon', () => {
    const icon = <span data-testid="left-icon">←</span>
    render(<Button leftIcon={icon}>Button</Button>)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('should render right icon', () => {
    const icon = <span data-testid="right-icon">→</span>
    render(<Button rightIcon={icon}>Button</Button>)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('should hide icons when loading', () => {
    const leftIcon = <span data-testid="left-icon">←</span>
    const rightIcon = <span data-testid="right-icon">→</span>
    
    render(
      <Button isLoading leftIcon={leftIcon} rightIcon={rightIcon}>
        Button
      </Button>
    )
    
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
  })

  it('should forward ref to button element', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Button</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  it('should support all button HTML attributes', () => {
    render(
      <Button type="submit" form="test-form" name="test-button">
        Button
      </Button>
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('form', 'test-form')
    expect(button).toHaveAttribute('name', 'test-button')
  })
})

