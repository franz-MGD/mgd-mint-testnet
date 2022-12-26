import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';
import { Provider as StyletronProvider } from 'styletron-react';
import { Server } from 'styletron-engine-atomic';
import { styletron } from '../styletron';
import { sheetT } from 'styletron-engine-atomic/lib/server/server';

class MyDocument extends Document<{ stylesheets: sheetT[] }> {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps & { stylesheets: sheetT[] }> {
    const page = ctx.renderPage;

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      page({
        // Useful for wrapping the whole react tree
        enhanceApp: (App) => (props) =>
          (
            <StyletronProvider value={styletron}>
              <App {...props} />
            </StyletronProvider>
          ),
      });

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await Document.getInitialProps(ctx);
    const stylesheets = (styletron as Server).getStylesheets() || [];

    return { ...initialProps, stylesheets };
  }

  render(): JSX.Element {
    return (
      <Html lang='en'>
        <Head>
          {this.props.stylesheets.map((sheet, i) => (
            <style
              className='_styletron_hydrate_'
              dangerouslySetInnerHTML={{ __html: sheet.css }}
              media={sheet.attrs.media}
              data-hydrate={sheet.attrs['data-hydrate']}
              key={i}
            />
          ))}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
