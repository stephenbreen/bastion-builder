import type { Size } from '../types'

export function tileSpanClasses(size: Size): string {
  switch (size) {
    case 'cramped':
      return 'col-span-1 row-span-1'
    case 'roomy':
      return 'col-span-2 row-span-1'
    case 'vast':
      return 'col-span-2 row-span-2'
  }
}
