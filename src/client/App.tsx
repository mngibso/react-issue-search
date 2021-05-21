import * as React from 'react';

import Search from "./components/search";

const App = (props: AppProps) => {
	return (
		<main className="container my-5">
            <Search />
		</main>
	);
};

interface AppProps {}

export default App;
