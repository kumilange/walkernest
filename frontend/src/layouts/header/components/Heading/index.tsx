import houseImage from "./assets/house-white.png";

export default function Heading() {
  return (
    <h1 className="absolute top-2 left-2 flex w-[145px] items-center font-bungee-tint text-2xl text-white">
      <a href="/" className="flex h-8 items-center">
        <span
          className="inline-block h-6 w-6 bg-contain bg-no-repeat"
          style={{ backgroundImage: `url(${houseImage})` }}
        />
        <span className="ml-2 hidden sm:inline">Walkernest</span>
      </a>
    </h1>
  );
}
