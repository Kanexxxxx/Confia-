import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
export const metadata: Metadata = { title: 'Resultado', robots: { index: false, follow: false } };
export default function Resultado() { return <><Cabecalho /><main id="conteudo" className="capa"><h1>Análise indisponível</h1><p className="lead">O motor de verificação ainda está em desenvolvimento. Nenhum resultado foi emitido.</p><a href="/">Voltar ao início</a></main><Rodape /></>; }
