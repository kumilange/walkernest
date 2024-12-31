import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function CustomCard({
	title,
	description,
	content,
}: {
	title: string;
	description?: string;
	content: React.ReactNode;
}) {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>{content}</CardContent>
		</Card>
	);
}
