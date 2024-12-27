import { Button } from '@/components/ui/button';
import { PopoverClose } from '@/components/ui/popover';

type PopoverFooterProps = {
	actionName: string;
	action: () => void;
	cancel: () => void;
	isDisabled: boolean;
};

export default function PopoverFooter({
	actionName,
	action,
	cancel,
	isDisabled,
}: PopoverFooterProps) {
	return (
		<div className="w-full flex justify-between">
			<PopoverClose asChild>
				<Button variant="outline" onClick={cancel}>
					Cancel
				</Button>
			</PopoverClose>
			<PopoverClose asChild>
				<Button onClick={action} disabled={isDisabled}>
					{actionName}
				</Button>
			</PopoverClose>
		</div>
	);
}
