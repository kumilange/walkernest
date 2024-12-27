import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import MenuActionTrigger from './menu-action-trigger';
import PopoverCloseButton from './popover-close-button';
import CustomCard from './custom-card';

type MenuItemProps = {
	// for action trigger
	tooltip: string;
	actionIcon: React.ReactNode;
	// handle popover close
	hasOpenState?: boolean;
	closeCallback?: () => void;
	// for card
	title: string;
	description?: string;
	content: React.ReactNode;
};

export default function MenuItem(props: MenuItemProps) {
	const [open, setOpen] = useState(false);

	const handleOpenChange = (isOpen: boolean) => {
		// Prevent the Popover from closing when clicking outside
		if (!isOpen) return;
		setOpen(isOpen);
	};

	const popoverProps = props.hasOpenState
		? { open, onOpenChange: handleOpenChange }
		: {};

	return (
		<Popover {...popoverProps}>
			<MenuActionTrigger icon={props.actionIcon} tooltip={props.tooltip} />
			<PopoverContent
				className="relative w-[300px]"
				// onCloseAutoFocus called when focus moves to the trigger after closing. Prevent it by calling event.preventDefault
				onCloseAutoFocus={(e) => {
					e.preventDefault();
				}}
			>
				{props.hasOpenState ? (
					<Button
						variant="ghost"
						size="icon"
						className="absolute top-1 right-1 h-6 w-6"
						onClick={() => {
							setOpen(false);
							props.closeCallback && props.closeCallback();
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				) : (
					<PopoverCloseButton />
				)}
				<CustomCard {...props} />
			</PopoverContent>
		</Popover>
	);
}
