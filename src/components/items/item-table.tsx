import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleItems } from "@/lib/data";
import { Badge } from "../ui/badge";

export function ItemTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Featured Items</CardTitle>
        <CardDescription>A selection of notable items from the world.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rarity</TableHead>
              <TableHead className="text-right">Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      item.rarity === 'Legendary' ? 'default' : 
                      item.rarity === 'Epic' ? 'secondary' : 
                      'outline'
                    }
                    className={
                      item.rarity === 'Epic' ? 'bg-purple-600 text-white' : 
                      item.rarity === 'Legendary' ? 'bg-orange-500 text-white' : ''
                    }
                  >
                    {item.rarity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{item.level}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
