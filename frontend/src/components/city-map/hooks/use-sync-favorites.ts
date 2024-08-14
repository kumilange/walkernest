import { useEffect } from 'react';
import { useAtomFavItems } from '@/atoms';
import { getLocalStorageList } from '@/lib/localstorage';
import { FavoriteItem } from '@/types';

export default function useSyncFavorites() {
	const { favItems, setFavItems } = useAtomFavItems();
	const favStorageList = getLocalStorageList<FavoriteItem>('favorites');

	// Compare the current favorite items with the list from local storage
	// If they are different, update the state with the new list
	useEffect(() => {
		if (JSON.stringify(favItems) !== JSON.stringify(favStorageList)) {
			setFavItems(favStorageList);
		}
	}, [favStorageList, favItems, setFavItems]);
}
