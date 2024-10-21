import { Theme, useTheme } from 'remix-themes';

import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { FiMoon, FiSun } from 'react-icons/fi';
import { MdComputer } from 'react-icons/md';

export function ModeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='select-none'>
          <FiSun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <FiMoon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme(Theme.LIGHT)}>
          <FiSun className='mr-2 h-4 w-4' />
          Light Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(Theme.DARK)}>
          <FiMoon className='mr-2 h-4 w-4' />
          Dark Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(null)}>
          <MdComputer className='mr-2 h-4 w-4' />
          System Mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
