import { Link, useLocation } from "@remix-run/react";
import { HiOutlineLogout } from "react-icons/hi";
import { Label } from "~/components/ui/label";
import { isAdmin } from "~/types/public-user";
import { FaCaretDown } from "react-icons/fa";
import { VscThreeBars } from "react-icons/vsc";
import { docsConfig } from "~/config/docs";
import { cn } from "~/lib/utils";
import { useUser } from '~/hooks/useUser';

export default function Sidebar() {
  const user = useUser();
  const location = useLocation();
  return (
    <aside className='group/sidebar bg-background shadow-md w-64 transition-all duration-300 flex flex-col min-h-screen [&:has(>input:checked)]:w-16'>
      <input type='checkbox' id='toggle-sidebar' className='hidden' title='Toggle Sidebar' />
      <div className='flex-grow overflow-y-auto'>
        <div className='p-4 flex items-center justify-between'>
          <h1 className='text-2xl font-bold group-[:has(>input:checked)]/sidebar:hidden'>Dashboard</h1>
          <Label
            htmlFor='toggle-sidebar'
            className='cursor-pointer group-[:has(>input:checked)]/sidebar:w-full group-[:has(>input:checked)]/sidebar:flex group-[:has(>input:checked)]/sidebar:justify-center'
            aria-label='Toggle Sidebar'
          >
            <VscThreeBars className='w-6 h-6' />
          </Label>
        </div>
        <nav className='mt-4'>
          {docsConfig.sidebarNav.map(group => {
            if (group.needAdmin && !isAdmin(user)) {
              return null;
            }
            return (
              <div key={group.title} className='mb-2 select-none'>
                <details className='group [&_summary::-webkit-details-marker]:hidden' open>
                  <summary className='w-full flex items-center justify-between py-3 px-4 bg-secondary text-muted-foreground transition-all hover:text-primary cursor-pointer font-medium group-[:has(>input:checked)]/sidebar:justify-center'>
                    <div className='flex items-center'>
                      {group.icon && (
                        <group.icon className='w-5 h-5 mr-2 group-[:has(>input:checked)]/sidebar:mr-0' />
                      )}
                      <span className='group-[:has(>input:checked)]/sidebar:hidden'>{group.title}</span>
                    </div>
                    <FaCaretDown className='w-4 h-4 transition group-open:rotate-180 duration-75 group-[:has(>input:checked)]/sidebar:hidden' />
                  </summary>
                  <div className='group-[:has(>input:checked)]/sidebar:pl-0'>
                    {group.items.map(item => (
                      <Link
                        key={item.title}
                        to={item.href ?? "#"}
                        className={cn(
                          `flex items-center py-2 px-4 text-muted-foreground transition-all hover:text-primary group-[:has(>input:checked)]/sidebar:justify-center`,
                          { "text-primary": location.pathname === item.href }
                        )}
                      >
                        {item.icon && (
                          <item.icon className='w-5 h-5 mr-2 group-[:has(>input:checked)]/sidebar:mr-0' />
                        )}
                        <span className='group-[:has(>input:checked)]/sidebar:hidden'>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </details>
              </div>
            );
          })}
        </nav>
      </div>

      <div className='border-t p-4 flex items-center group-[:has(>input:checked)]/sidebar:justify-center'>
        <div className='group-[:has(>input:checked)]/sidebar:hidden'>
          <p className='font-bold'>{user?.username ?? "user1"}</p>
          <p className='text-sm text-muted-foreground'>{user?.role?.name ?? "admin"}</p>
        </div>
        <Link
          to='/logout'
          className='ml-auto p-2 group-[:has(>input:checked)]/sidebar:ml-0'
          aria-label='Logout'
          title='Logout'
        >
          <HiOutlineLogout className='w-5 h-5' />
        </Link>
      </div>
    </aside>
  );
}
