import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useSetAtom } from 'jotai';
import { cityAtom } from '@/atoms';
import ErrorFallback from './error-fallback';

export default function ErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	const setCity = useSetAtom(cityAtom);

	return (
		<ReactErrorBoundary
			FallbackComponent={ErrorFallback}
			onReset={() => {
				setCity(null);
			}}
		>
			{children}
		</ReactErrorBoundary>
	);
}
