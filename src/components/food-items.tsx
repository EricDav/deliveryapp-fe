import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface FoodItemsProps {
  title: string
  type: "selling" | "rated"
}

const foodItems = [
  {
    id: 1,
    name: "Village Rice",
    image: "/rice.png",
    sold: 0,
    rating: 0,
    reviews: 0,
  },
  {
    id: 2,
    name: "Asun meat",
    image: "/asun.png",
    sold: 0,
    rating: 0,
    reviews: 0,
  },
  {
    id: 3,
    name: "Spicy chicks",
    image: "/snail.png",
    sold: 0,
    rating: 0,
    reviews: 0,
  },
  {
    id: 4,
    name: "Pepper Soup",
    image: "/placeholder.svg?height=200&width=200",
    sold: 0,
    rating: 0,
    reviews: 0,
  },
  {
    id: 5,
    name: "Fried Rice",
    image: "/placeholder.svg?height=200&width=200",
    sold: 0,
    rating: 0,
    reviews: 0,
  },
  {
    id: 6,
    name: "Rice & Stew",
    image: "/placeholder.svg?height=200&width=200",
    sold: 0,
    rating: 0,
    reviews: 0,
  },
]

export function FoodItems({ title, type }: FoodItemsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">
          {type === "selling" ? (
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-bar-chart-2"
              >
                <line x1="18" x2="18" y1="20" y2="10" />
                <line x1="12" x2="12" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="14" />
              </svg>
              {title}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Star className="h-6 w-6" />
              {title}
            </span>
          )}
        </CardTitle>
        <Link href="#" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foodItems.slice(0, 3).map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border">
              <div className="relative aspect-square overflow-hidden">
                {type === "selling" && (
                  <Badge className="absolute left-2 top-2 z-10 bg-green-800 text-white">Sold: {item.sold}</Badge>
                )}
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="object-cover transition-transform group-hover:scale-105"
                  fill
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium">{item.name}</h3>
                {type === "rated" && (
                  <div className="mt-1 flex items-center text-sm">
                    <Star className="mr-1 h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="mr-1">{item.rating}</span>
                    <span className="text-muted-foreground">({item.reviews} Reviews)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

