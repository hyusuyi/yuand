import Table from "../components/Table";

export default function TestPage() {
  const [table] = Table.useTable();
  return (
    <Table
      request={{ url: "./sss" }}
      table={table}
      columns={[
        {
          width: 200,
          title: "Name",
          dataIndex: "name",
          key: "name",
          colSpan: 2,
        },
      ]}
    />
  );
}
