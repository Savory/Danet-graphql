/**
 * @module
 * Static GraphiQL page served to browsers when the playground option is
 * enabled.
 */

/** Renders the GraphiQL HTML page querying the endpoint at `path`. */
export function graphiqlHtml(path: string): string {
	return `<!doctype html>
<html lang="en">
	<head>
		<title>GraphiQL</title>
		<style>
			body { margin: 0; }
			#graphiql { height: 100vh; }
		</style>
		<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
		<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
		<link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
	</head>
	<body>
		<div id="graphiql">Loading GraphiQL...</div>
		<script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
		<script>
			const fetcher = GraphiQL.createFetcher({ url: ${JSON.stringify(path)} });
			ReactDOM.createRoot(document.getElementById('graphiql')).render(
				React.createElement(GraphiQL, { fetcher }),
			);
		</script>
	</body>
</html>`;
}
