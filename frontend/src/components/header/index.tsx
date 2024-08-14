import Heading from '@/components/heading';
import MenuBar from '@/components/menu-bar';

export default function Header() {
	return (
		<header className="w-screen h-12 flex items-center bg-primary shadow-md p-2">
			<Heading />
			<MenuBar />
		</header>
	);
}
