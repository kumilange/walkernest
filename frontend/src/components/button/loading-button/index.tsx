import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoadingButton() {
	return (
		<Button disabled className="flex gap-2">
			<Loader2 className="animate-spin" />
			Analyzing...
		</Button>
	);
}
