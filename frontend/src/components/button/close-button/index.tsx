import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CloseButtonProps = {
	handleClose: () => void;
};

export default function CloseButton({ handleClose }: CloseButtonProps) {
	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-6 w-6"
			onClick={handleClose}
		>
			<X className="h-4 w-4" />
		</Button>
	);
}
