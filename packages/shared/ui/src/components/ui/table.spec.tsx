import "@testing-library/jest-dom/vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableHeadSortable,
  TableCell,
  TableEmpty,
  TableSkeleton,
  TablePagination,
  DataTable,
  type ColumnDef,
} from "./table"

describe("Table Primitives & Density", () => {
  it("renders table with density and striped variant correctly", () => {
    const { container } = render(
      <Table density="compact" variant="striped" stickyHeader>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead align="right">Nilai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell>Item 1</TableCell>
            <TableCell align="right" mono>
              100
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByText("Nama")).toBeInTheDocument()
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(container.querySelector("[data-state='selected']")).toBeInTheDocument()
  })

  it("handles TableHeadSortable interactions", () => {
    const onSort = vi.fn()
    const { rerender } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadSortable sortDirection={false} onSort={onSort}>
              Header Sort
            </TableHeadSortable>
          </TableRow>
        </TableHeader>
      </Table>
    )

    const sortButton = screen.getByText("Header Sort")
    fireEvent.click(sortButton)
    expect(onSort).toHaveBeenCalledWith("asc")

    rerender(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadSortable sortDirection="asc" onSort={onSort}>
              Header Sort
            </TableHeadSortable>
          </TableRow>
        </TableHeader>
      </Table>
    )
    fireEvent.click(sortButton)
    expect(onSort).toHaveBeenCalledWith("desc")
  })

  it("renders TableEmpty properly with action slot", () => {
    render(
      <Table>
        <TableBody>
          <TableEmpty
            colSpan={4}
            title="Data Kosong"
            description="Tidak ada data untuk ditampilkan"
            action={<button type="button">Tambah Data</button>}
          />
        </TableBody>
      </Table>
    )

    expect(screen.getByText("Data Kosong")).toBeInTheDocument()
    expect(screen.getByText("Tidak ada data untuk ditampilkan")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tambah Data" })).toBeInTheDocument()
  })

  it("renders TableSkeleton placeholder rows", () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableSkeleton columns={3} rows={4} />
        </TableBody>
      </Table>
    )

    const skeletonRows = container.querySelectorAll(".animate-pulse")
    expect(skeletonRows.length).toBe(4)
  })

  it("renders TablePagination and handles page changes", () => {
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()

    render(
      <TablePagination
        page={2}
        pageSize={10}
        totalItems={50}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    )

    expect(screen.getByText(/Menampilkan/i)).toBeInTheDocument()
    expect(screen.getByText("11")).toBeInTheDocument()
    expect(screen.getAllByText("20").length).toBeGreaterThanOrEqual(1)

    // Klik tombol next
    const nextBtn = screen.getByTitle("Halaman Berikutnya")
    fireEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(3)

    // Ubah page size
    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "20" } })
    expect(onPageSizeChange).toHaveBeenCalledWith(20)
  })
})

describe("TanStack Powered DataTable Component", () => {
  interface UserItem {
    id: string
    name: string
    role: string
    email: string
  }

  const sampleUsers: UserItem[] = [
    { id: "1", name: "Budi Santoso", role: "Admin", email: "budi@bgs.com" },
    { id: "2", name: "Ani Lestari", role: "Developer", email: "ani@bgs.com" },
    { id: "3", name: "Citra Dewi", role: "Designer", email: "citra@bgs.com" },
  ]

  const columns: ColumnDef<UserItem, any>[] = [
    { accessorKey: "name", header: "Nama Lengkap" },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "email", header: "Email" },
  ]

  it("renders data correctly and supports global search", () => {
    render(
      <DataTable
        data={sampleUsers}
        columns={columns}
        showSearch={true}
        searchPlaceholder="Cari pengguna..."
      />
    )

    expect(screen.getByText("Budi Santoso")).toBeInTheDocument()
    expect(screen.getByText("Ani Lestari")).toBeInTheDocument()

    // Cari pengguna
    const searchInput = screen.getByPlaceholderText("Cari pengguna...")
    fireEvent.change(searchInput, { target: { value: "Ani" } })

    // Wait for debounced filter if applicable or instant value
    expect(searchInput).toHaveValue("Ani")
  })

  it("supports selectable rows and bulk actions", () => {
    const onRowSelectionChange = vi.fn()

    render(
      <DataTable
        data={sampleUsers}
        columns={columns}
        enableRowSelection={true}
        onRowSelectionChange={onRowSelectionChange}
        bulkActions={(selectedRows) => (
          <button type="button">Hapus {selectedRows.length} Data</button>
        )}
      />
    )

    const selectAllCheckbox = screen.getByLabelText("Select all")
    fireEvent.click(selectAllCheckbox)

    expect(onRowSelectionChange).toHaveBeenCalled()
  })

  it("renders empty state when no results match", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        emptyState={{
          title: "Pengguna Tidak Ditemukan",
          description: "Coba kata kunci lain.",
        }}
      />
    )

    expect(screen.getByText("Pengguna Tidak Ditemukan")).toBeInTheDocument()
    expect(screen.getByText("Coba kata kunci lain.")).toBeInTheDocument()
  })

  it("supports server-side fetcher mode with loading state", async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      data: [{ id: "10", name: "Joko", role: "Staff", email: "joko@bgs.com" }],
      totalCount: 1,
    })

    render(
      <DataTable
        columns={columns}
        fetcher={mockFetcher}
      />
    )

    expect(mockFetcher).toHaveBeenCalled()
  })
})
