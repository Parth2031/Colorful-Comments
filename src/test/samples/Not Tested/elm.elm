
--!(no space)
-- ! (space)
--  !   tab then tab
--  ! tab then space
import Html exposing (..)

--! user status
type UserStatus = Regular | Visitor

{-
! type alias User
* type alias User
? type alias User
^ typ alias Book
-}
type alias User =
    {
        firstName : String
      , lastName : String
      , age : Int
      , status : UserStatus
    }

tom = {firstName = "tom", lastName = "john", age = 34, status = Visitor }

main =
    text "Hello world!"

{-
    ^ tab ^
        !double tab
            ?triple tab
                *quadruple tab
-}