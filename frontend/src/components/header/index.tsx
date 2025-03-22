import Heading from '@/components/heading';
import MenuBar from '@/components/menu-bar';

export default function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 h-12 w-screen z-10 flex items-center bg-primary shadow-md p-2">
			<Heading />
			<MenuBar />
		</header>
	);
}
