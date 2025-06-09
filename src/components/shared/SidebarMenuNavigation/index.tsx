import { useState } from 'react'

const SidebarMenuNavigation = () => {
	const [isOpen, setIsOpen] = useState(false)

	const toggleSidebar = () => {
		setIsOpen(!isOpen)
	}

	return (
		<div className='relative'>
			{/* Button to toggle sidebar - only on small screens */}
			<button
				className='p-4 text-white bg-blue-600 rounded-md lg:hidden'
				onClick={toggleSidebar}
			>
				<span className='material-icons'>menu</span>
			</button>

			{/* Mobile Sidebar (overlay style) */}
			<div
				className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className='flex justify-between items-center p-4'>
					<span className='text-lg font-semibold'>Menu</span>
					<button className='text-white' onClick={toggleSidebar}>
						<span className='material-icons'>close</span>
					</button>
				</div>

				<nav className='p-4'>
					<ul>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Dashboard
							</a>
						</li>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Profile
							</a>
						</li>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Settings
							</a>
						</li>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Help
							</a>
						</li>
					</ul>
				</nav>
			</div>

			{/* Desktop Sidebar - always visible on large screens */}
			<div className='hidden lg:block fixed top-0 left-0 w-64 h-full bg-gray-800 text-white'>
				<div className='flex justify-between items-center p-4'>
					<span className='text-lg font-semibold'>Menu</span>
				</div>

				<nav className='p-4'>
					<ul>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Dashboard
							</a>
						</li>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Profile
							</a>
						</li>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Settings
							</a>
						</li>
						<li className='mb-4'>
							<a href='#' className='text-gray-300 hover:text-white'>
								Help
							</a>
						</li>
					</ul>
				</nav>
			</div>
		</div>
	)
}

export default SidebarMenuNavigation
