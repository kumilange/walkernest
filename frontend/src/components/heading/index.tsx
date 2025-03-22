import houseImage from '@/assets/house-white.png';

export default function Heading() {
	return (
		<h1 className="absolute top-2 left-2 w-[145px] flex items-center text-white text-2xl font-bungee-tint">
			<a href="/" className="flex items-center h-8">
				<span
					className="inline-block w-6 h-6 bg-contain bg-no-repeat"
					style={{ backgroundImage: `url(${houseImage})` }}
				/>
				<span className="hidden sm:inline ml-2">Walkernest</span>
			</a>
		</h1>
	);
}
