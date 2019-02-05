package main

import (
	"database/sql"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

type Farmacia struct {
	Codigo             int
	Cnpj               string
	Nome               string
	Produtos_com_preco int
	Produtos_sem_preco int
	Total              int
	Produtos_repetidos int
}

func main() {
	router, auth, addr :=
		setUpServer("app/*.html",
			"favicon.ico",
			"app/assets/img/",
			"app/assets/scripts/",
			"app/assets/stylesheet/")

	//HTML responses
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", nil)
	})

	router.GET("/home", func(c *gin.Context) {
		if auth {
			c.HTML(http.StatusOK, "home.html", nil)
		} else {
			c.HTML(http.StatusOK, "login.html", nil)
		}
	})

	//JSON responses
	router.GET("/report", func(c *gin.Context) {
		data := getReport()
		c.JSON(http.StatusOK, data)
	})

	router.POST("/logon", func(c *gin.Context) {
		if auth = authenticate(c.PostForm("email"), c.PostForm("password")); auth {
			c.JSON(http.StatusOK, gin.H{"code": "OK", "message": "Usuário autorizado"})
		} else {
			c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": "Usuário não autorizado"})
		}
	})

	router.GET("/logoff", func(c *gin.Context) {
		auth = false
		c.JSON(http.StatusOK, gin.H{"code": "OK"})
	})

	router.DELETE("/delete-duplicates", func(c *gin.Context) {
		if auth {
			id := strings.Replace(c.Request.RequestURI, "/delete-duplicates?Id=", "", -1)

			result, _ := deleteDuplicates(id)
			if rows, _ := result.RowsAffected(); rows != 0 {
				c.JSON(http.StatusOK, gin.H{"code": "OK", "message": "Registros excluidos com sucesso!"})
			} else {
				c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": "Registros não foram excluidos!"})
			}
		} else {
			c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": "Usuário não autorizado!"})
		}
	})

	router.Run(addr)
}

func setUpServer(Assets ...interface{}) (*gin.Engine, bool, string) {
	r := gin.New()
	r.Use(gin.Logger())
	for index, files := range Assets {
		if index == 0 {
			r.LoadHTMLGlob(files.(string))
		} else {
			r.Static(files.(string), files.(string))
		}
	}
	return r, false, ":" + os.Getenv("PORT")
}

func dbConn() (db *sql.DB) {
	dbDriver := "mysql"
	dbServer := os.Getenv("DATABASE_SERVER")
	dbUser := os.Getenv("DATABASE_USERNAME")
	dbPass := os.Getenv("DATABASE_PASSWORD")
	dbName := os.Getenv("DATABASE_NAME")
	dbPort := os.Getenv("DATABASE_PORT")

	db, err := sql.Open(dbDriver, dbUser+":"+dbPass+"@tcp("+dbServer+":"+dbPort+")/"+dbName)
	if err != nil {
		panic(err.Error())
	}
	return db
}

func authenticate(email string, password string) bool {
	db := dbConn()
	selDB, err := db.Query("select * from usuarios where  usuarios_email = ? and usuarios_senha = ? ", email, password)
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()
	if selDB.Next() {
		return true
	}
	return false
}

func getReport() []Farmacia {
	db := dbConn()
	selDB, err := db.Query(`select f.farmacias_id as codigo
							, f.farmacias_cnpj  as cnpj
							, f.farmacias_titulo as nome
							, ( select count(*)
								from  farmaciasremedios as fr
								where fr.farmaciasremedios_preco > 0  and
								fr.farmaciasremedios_farmacias_id = f.farmacias_id ) as produtos_com_preco
							, ( select count(*)
								from  farmaciasremedios as fr
								where ( fr.farmaciasremedios_preco = 0 or fr.farmaciasremedios_preco is null ) and
								fr.farmaciasremedios_farmacias_id = f.farmacias_id ) as produtos_sem_preco 
							,  ( select count(*)
								from  farmaciasremedios as fr
								where	fr.farmaciasremedios_farmacias_id = f.farmacias_id ) as total
							, ifnull(( select sum(t.qtd)
									from ( 	
												select count(concat(farmaciasremedios_remediosvariacoes_id 
														, farmaciasremedios_farmacias_id)) as qtd
														, farmaciasremedios_remediosvariacoes_id 
														, farmaciasremedios_farmacias_id
												from farmaciasremedios 
												group by  farmaciasremedios_remediosvariacoes_id 
														, farmaciasremedios_farmacias_id
												having qtd > 1 ) as t
									where t.farmaciasremedios_farmacias_id = f.farmacias_id ),0) as produos_repetidos
						from farmacias as f order by cnpj`)
	if err != nil {
		panic(err.Error())
	}
	farmacias := []Farmacia{}
	for selDB.Next() {
		var codigo int
		var cnpj, nome string
		var produtos_com_preco, produtos_sem_preco, total, produtos_repetidos int

		err := selDB.Scan(&codigo, &cnpj, &nome, &produtos_com_preco, &produtos_sem_preco, &total, &produtos_repetidos)
		if err != nil {
			panic(err.Error())
		}

		farmacia := Farmacia{Codigo: codigo, Cnpj: cnpj, Nome: nome, Produtos_com_preco: produtos_com_preco, Produtos_sem_preco: produtos_sem_preco, Produtos_repetidos: produtos_repetidos}
		farmacias = append(farmacias, farmacia)
	}
	defer db.Close()
	return farmacias
}

func deleteDuplicates(farmacia_id string) (sql.Result, error) {
	db := dbConn()
	delForm, err := db.Prepare(`delete	fr2
	from		farmaciasremedios as fr
	 inner	join farmaciasremedios as fr2 
		on		( fr.farmaciasremedios_remediosvariacoes_id = fr2.farmaciasremedios_remediosvariacoes_id
	   and 	fr.farmaciasremedios_farmacias_id = fr2.farmaciasremedios_farmacias_id
	   and	fr.farmaciasremedios_id > fr2.farmaciasremedios_id )
	   where	fr.farmaciasremedios_farmacias_id = ?`)
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	return delForm.Exec(farmacia_id)
}
