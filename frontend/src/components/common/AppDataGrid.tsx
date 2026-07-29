import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import type { GridColDef, GridRowsProp } from "@mui/x-data-grid";

interface Props {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  height?: number;
}

export default function AppDataGrid({
  rows,
  columns,
  loading = false,
  height = 650,
}: Props) {
  return (
    <div style={{ height, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
              page: 0,
            },
          },
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        sx={{
          borderRadius: 3,

          "& .MuiDataGrid-columnHeaders": {
            fontWeight: 700,
            fontSize: 15,
          },

          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f5f7fb",
          },
        }}
      />
    </div>
  );
}