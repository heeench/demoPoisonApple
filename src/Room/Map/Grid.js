import React from 'react';
import MapTool from './MapTool';
import '../../styles/Grid.css'

const Grid = ({ rows, cols, cellSize }) => {
    return (
      <div className="grid">
        <MapTool rows={rows} cols={cols} cellSize={cellSize} />
      </div>
    );
  };
  
  export default Grid;