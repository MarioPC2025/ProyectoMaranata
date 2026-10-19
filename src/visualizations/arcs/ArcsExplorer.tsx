import { useMemo, useState } from 'react';
import { isNativeApp } from '../../app/native-app.ts';
import {
  ClickIcon,
  DragIcon,
  HoldAndSlideIcon,
  PinchIcon,
  ScrollIcon,
  TapIcon,
} from '../../shared/ui/icons.tsx';
import { Credits } from '../shared/components/Credits.tsx';
import { FiltersMenu } from '../shared/components/FiltersMenu.tsx';
import { GenreLegend } from '../shared/components/GenreLegend.tsx';
import { GenreMenu } from '../shared/components/GenreMenu.tsx';
import { toggleGenre } from '../shared/components/GenreToggles.tsx';
import { LinkStats } from '../shared/components/LinkStats.tsx';
import { OptionsMenu } from '../shared/components/MenuButton.tsx';
import { PassagePanel } from '../shared/components/PassagePanel.tsx';
import { ReferenceSearch } from '../shared/components/ReferenceSearch.tsx';
import { VizPage } from '../shared/components/VizPage.tsx';
import { DEFAULT_LINK_FILTER, isDefaultFilter, selectLinks } from '../shared/link-filter.ts';
import { summarizeLinks } from '../shared/link-summary.ts';
import type { Passage } from '../../core/bible/passage.ts';
import type { Connection } from '../shared/connections.ts';
import type { VisualizationProps } from '../visualization.ts';
import { ArcsStage } from './ArcsStage.tsx';

const INSPIRATION = {
  title: 'Bible Cross-References',
  author: 'Chris Harrison and Christoph Römhild',
  url: 'https://www.chrisharrison.net/index.php/visualizations/BibleViz',
};

export function ArcsExplorer({
  data,
  active,
  passage,
  onNavigate,
  filter,
  onFilterChange,
  masthead,
  translationMenu,
  passageLinks,
  shareUrl,
}: VisualizationProps) {
  const { index } = data.crossReferences;
  const linkIds = useMemo(
    () => selectLinks(index, data.verseGenres, filter),
    [index, data.verseGenres, filter],
  );
  const summary = useMemo(
    () => summarizeLinks(index, linkIds, data.verseGenres),
    [index, linkIds, data.verseGenres],
  );
  const closePanel = () => {
    onNavigate(null);
  };
  // A connection pointed at in the panel; it belongs to the passage it was pointed at on.
  const [preview, setPreview] = useState<{
    readonly passage: Passage;
    readonly connection: Connection;
  } | null>(null);
  const previewed = preview?.passage === passage ? preview.connection : null;
  // En la app de Android, un encabezado más simple: la búsqueda y un solo botón de opciones, sin
  // los contadores ni la leyenda sobre el diagrama (los gestos los explica el recorrido).
  const simple = isNativeApp();
  const toggleGenreOf = (genre: Parameters<typeof toggleGenre>[1]) => {
    onFilterChange({ ...filter, hiddenGenres: toggleGenre(filter.hiddenGenres, genre) });
  };
  const filtersMenu = (
    <FiltersMenu
      filter={filter}
      defaults={DEFAULT_LINK_FILTER}
      onChange={onFilterChange}
      shownLinks={linkIds.length}
      totalLinks={index.linkCount}
    />
  );

  return (
    <VizPage
      masthead={masthead}
      credits={<Credits translation={data.translation.manifest} inspiration={INSPIRATION} />}
      onPanelClose={closePanel}
      controls={
        <>
          <ReferenceSearch versification={data.versification} onSelect={onNavigate} />
          {simple ? (
            <OptionsMenu indicator={!isDefaultFilter(filter, DEFAULT_LINK_FILTER)}>
              {translationMenu}
              <GenreMenu hiddenGenres={filter.hiddenGenres} onToggle={toggleGenreOf} />
              {filtersMenu}
            </OptionsMenu>
          ) : (
            <>
              {translationMenu}
              {filtersMenu}
            </>
          )}
        </>
      }
      panel={
        passage && (
          <PassagePanel
            data={data}
            passage={passage}
            filter={filter}
            actions={passageLinks(passage)}
            onSelect={onNavigate}
            onClose={closePanel}
            shareUrl={shareUrl}
            onPreview={(connection) => {
              setPreview(connection && { passage, connection });
            }}
          />
        )
      }
    >
      <ArcsStage
        data={data}
        active={active}
        linkIds={linkIds}
        filter={filter}
        focus={passage}
        preview={previewed}
        onSelect={onNavigate}
      />
      {!simple && (
        <LinkStats
          summary={summary}
          hint={{
            pointer: (
              <>
                <ScrollIcon /> para acercar · <DragIcon /> para mover · <ClickIcon /> para enfocar
              </>
            ),
            touch: (
              <>
                <HoldAndSlideIcon /> mantén para ver · <TapIcon /> para enfocar · <PinchIcon /> para
                acercar
              </>
            ),
          }}
        />
      )}
      {!simple && <GenreLegend hiddenGenres={filter.hiddenGenres} onToggle={toggleGenreOf} />}
    </VizPage>
  );
}
